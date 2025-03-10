rewardpoints: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rewardpoints',
    required: false
},

// Update reward points based on number of trees planted
blockPlantationSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Calculate reward points
    const pointsToAdd = this.numberOfTrees; // 1 plant = 1 point
    if (this.rewardpoints) {
        const RewardpointsModel = require('./RewardppointsModel').Rewardpoints;
        const rewardEntry = await RewardpointsModel.findById(this.rewardpoints);
        
        if (rewardEntry) {
            rewardEntry.points += pointsToAdd; // Add points
            await rewardEntry.save(); // Save updated points
        }
    }
    
    next();
}); 