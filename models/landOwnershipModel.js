const mongoose = require('mongoose');

const landOwnershipSchema = new mongoose.Schema({
    ownershipType: {
        type: String,
        enum: [
            'PRIVATE',
            'GOVERNMENT',
            'COMMUNITY',
            'TEMPLE',
            'EDUCATIONAL_INSTITUTION',
            'CORPORATE',
            'FOREST_DEPARTMENT',
            'PANCHAYAT',
            'OTHER'
        ],
        required: [true, 'Ownership type is required']
    },
    ownerName: {
        type: String,
        required: [true, 'Owner name is required']
    },
    landArea: {
        value: {
            type: Number,
            required: [true, 'Land area value is required']
        },
        unit: {
            type: String,
            enum: ['ACRES', 'HECTARES', 'SQUARE_METERS'],
            required: [true, 'Land area unit is required']
        }
    },
    boundaries: {
        type: {
            type: String,
            enum: ['Polygon'],
            required: true,
            default: 'Polygon'
        },
        coordinates: {
            type: [[[Number]]],  // Array of arrays of arrays of numbers
            required: [true, 'Boundary coordinates are required'],
            validate: {
                validator: function(coords) {
                    // Validate that it's a proper polygon (first and last points match)
                    if (coords.length === 0 || coords[0].length < 4) return false;
                    const firstPoint = coords[0][0];
                    const lastPoint = coords[0][coords[0].length - 1];
                    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
                },
                message: 'Invalid polygon coordinates. Must be a closed polygon with at least 4 points.'
            }
        }
    },
    landUseType: {
        type: String,
        enum: [
            'AGRICULTURAL',
            'FOREST',
            'BARREN',
            'INSTITUTIONAL',
            'COMMERCIAL',
            'RESIDENTIAL',
            'OTHER'
        ],
        required: [true, 'Land use type is required']
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING'
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verificationDate: Date,
    verificationComments: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp before saving
landOwnershipSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create a 2dsphere index for the boundaries
landOwnershipSchema.index({ boundaries: '2dsphere' });

module.exports = mongoose.model('LandOwnership', landOwnershipSchema); 