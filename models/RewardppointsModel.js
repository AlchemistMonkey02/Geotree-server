const mongoose=require('mongoose');

const rewardpoints = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    plantsPlanted: {
        type: Number,
        default: 0 // Default to 0 if not specified
    },
    totalPlantsPlanted: {
        type: Number,
        default: 0 // Default to 0 if not specified
    },
    // New field to calculate plants planted based on points rewarded
    plantsBasedOnPoints: {
        type: Number,
        default: function() {
            return Math.floor(this.points / 10); // Assuming 10 points per plant
        }
    }
});


const Rewardpoints= mongoose.model('Rewardpoints',rewardpoints);


module.exports={Rewardpoints}


