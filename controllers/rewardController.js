const Rewardpoints = require('../models/RewardppointsModel').Rewardpoints;
const IndividualPlantation = require('../models/individualPlantationModel');
const BlockPlantation = require('../models/blockPlantationModel');
const mongoose = require('mongoose');

async function awardPoints(req, res) {
    try {
        const { plantationId, type } = req.body; // type can be 'individual' or 'block'

        // Validate plantationId
        if (!mongoose.Types.ObjectId.isValid(plantationId)) {
            return res.status(400).json({ message: 'Invalid plantation ID' });
        }

        let plantation;

        if (type === 'individual') {
            plantation = await IndividualPlantation.findById(plantationId).populate('rewardpoints');
        } else if (type === 'block') {
            plantation = await BlockPlantation.findById(plantationId).populate('Rewardpoints');
        } else {
            return res.status(400).json({ message: 'Invalid plantation type' });
        }

        if (!plantation) {
            return res.status(404).json({ message: 'Plantation not found' });
        }

        // Check if reward points exist, if not create a new entry
        let rewardEntry = plantation.rewardpoints || plantation.Rewardpoints;
        if (!rewardEntry) {
            rewardEntry = new Rewardpoints({ points: 0 });
            await rewardEntry.save();
            if (type === 'individual') {
                plantation.rewardpoints = rewardEntry._id;
            } else {
                plantation.Rewardpoints = rewardEntry._id;
            }
            await plantation.save();
        }

        // Award points based on the type of plantation
        const pointsToAdd = type === 'individual' ? plantation.plants.length : plantation.numberOfTrees;
        rewardEntry.points += pointsToAdd;
        await rewardEntry.save();

        return res.status(200).json({ message: 'Points awarded successfully', points: rewardEntry.points });
    } catch (error) {
        return res.status(500).json({ message: 'Error awarding points', error: error.message });
    }
}

module.exports = { awardPoints }; 