const businessService = require('../../services/businessService');
const CustomError = require('../../utilities/errors');

async function getAllBusinesses(req, res, next) {
    try {
        const result = await businessService.getAllBusinesses({ query: req.query });
        res.status(200).json({ message: 'Businesses fetched successfully', ...result });
    } catch (err) {
        next(err);
    }
}

async function getBusinessById(req, res, next) {
    try {
        const { id } = req.params;
        const business = await businessService.getBusinessById({ id });
        if (!business) {
            throw new CustomError({ statusCode: 404, message: 'Business not found' });
        }
        res.status(200).json({ message: 'Business fetched successfully', business });
    } catch (err) {
        next(err);
    }
}

async function createBusiness(req, res, next) {
    try {
        const created = await businessService.createBusiness(req.body);
        res.status(201).json({ message: 'Business created successfully', ...created });
    } catch (err) {
        next(err);
    }
}

async function updateBusiness(req, res, next) {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;
        const result = await businessService.updateBusiness({ id, name, email, password });
        res.status(200).json({ message: 'Business updated successfully', ...result });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllBusinesses,
    getBusinessById,
    createBusiness,
    updateBusiness,
};
