const mongoose = require('mongoose');

const treeSpeciesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tree species name is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    }
});

const blockPlantationSchema = new mongoose.Schema({
    organizationType: {
        type: String,
        enum: ['GOVERNMENT', 'NGO', 'INDIVIDUAL'],
        required: [true, 'Organization type is required']
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: [true, 'State is required']
    },
    district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: [true, 'District is required']
    },
    village: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Village',
        required: [true, 'Village is required']
    },
    gramPanchayat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GramPanchayat',
        required: [true, 'Gram Panchayat is required']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: function() {
            return this.organizationType === 'GOVERNMENT';
        }
    },
    ngoName: {
        type: String,
        required: function() {
            return this.organizationType === 'NGO';
        }
    },
    ngoRegistrationNumber: {
        type: String,
        required: function() {
            return this.organizationType === 'NGO';
        }
    },
    individualName: {
        type: String,
        required: function() {
            return this.organizationType === 'INDIVIDUAL';
        }
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    plantationArea: {
        value: {
            type: Number,
            required: [true, 'Plantation area value is required'],
            min: [0, 'Area must be positive']
        },
        unit: {
            type: String,
            enum: ['ACRES', 'HECTARES', 'SQUARE_METERS'],
            required: [true, 'Area unit is required']
        }
    },
    numberOfTrees: {
        type: Number,
        required: [true, 'Number of trees is required'],
        min: [1, 'Must plant at least one tree']
    },
    plantationDate: {
        type: Date,
        required: [true, 'Plantation date is required']
    },
    treeSpecies: {
        type: [treeSpeciesSchema],
        required: [true, 'At least one tree species is required'],
        validate: {
            validator: function(species) {
                if (species.length === 0) return false;
                // Validate total matches numberOfTrees
                const total = species.reduce((sum, sp) => sum + sp.quantity, 0);
                return total === this.numberOfTrees;
            },
            message: 'Sum of tree species quantities must match total number of trees'
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: [true, 'Coordinates are required']
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
            type: [[[Number]]],
            required: [true, 'Boundary coordinates are required'],
            validate: {
                validator: function(coords) {
                    if (coords.length === 0 || coords[0].length < 4) return false;
                    const firstPoint = coords[0][0];
                    const lastPoint = coords[0][coords[0].length - 1];
                    return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
                },
                message: 'Invalid polygon coordinates. Must be a closed polygon with at least 4 points.'
            }
        }
    },
    status: {
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
    surveyDetails: {
        lastSurveyDate: Date,
        treesSurvived: Number,
        averageHeight: Number,
        healthStatus: {
            type: String,
            enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
        },
        surveyPhotos: [{
            url: String,
            caption: String,
            uploadDate: {
                type: Date,
                default: Date.now
            }
        }]
    },
    photos: [{
        url: String,
        caption: String,
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    landOwnership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandOwnership',
        required: [true, 'Land ownership details are required']
    },
    plants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant'
    }],
    area: {
        type: Number,
        required: true
    }
});

// Update timestamp on save
blockPlantationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Geospatial indexes
blockPlantationSchema.index({ location: '2dsphere' });
blockPlantationSchema.index({ boundaries: '2dsphere' });

// Virtual for survival rate
blockPlantationSchema.virtual('survivalRate').get(function() {
    if (!this.surveyDetails?.treesSurvived || !this.numberOfTrees) return null;
    return (this.surveyDetails.treesSurvived / this.numberOfTrees) * 100;
});

const BlockPlantation = mongoose.model('BlockPlantation', blockPlantationSchema);

module.exports = BlockPlantation;
