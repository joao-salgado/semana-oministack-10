const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../util/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {

    async index(req, res) {
        const devs = await Dev.find();
        return res.json(devs);
    },

    async store(req, res) {
        const {
            github_username,
            techs,
            latitude,
            longitude,
        } = req.body;

        let dev = await Dev.findOne({ github_username });

        if (!dev) {
            const apiGit = await axios.get(`https://api.github.com/users/${github_username}`);
    
            const {
                name = login,
                avatar_url,
                bio
            } = apiGit.data;
        
            const techsArray = parseStringAsArray(techs);
        
            const location = {
                type: 'Point',
                coordinates: [longitude, latitude]
            }
        
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location
            });

            // filtrar conexões que estão em até 10km e que o novo dev tenha 
            // alguma das tecnologias filtradas
            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray
            );

            console.log(sendSocketMessageTo);

            sendMessage(sendSocketMessageTo, 'new-dev', dev);

        }

        return res.json(dev);
    }
}