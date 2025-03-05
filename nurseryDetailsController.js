// Get all NurseryDetails entries
exports.getAllNurseryDetails = async (req, res) => {
    try {
        const nurseryDetails = await NurseryDetails.find()
            .populate('nurseryId') // Populate nursery details
            .populate('plantHistory.plantId', 'name'); // Populate plantId and only get the name field
        res.status(200).json(nurseryDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 