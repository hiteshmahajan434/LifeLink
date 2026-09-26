import HospitalResource from '../models/HospitalResource.js';


/**
 * GET Hospital Resources
 *
 * GET /api/hospital/resources
 */
export const getHospitalResources = async (req, res, next) => {
  try {
    const resources = await HospitalResource.findOne({
      hospitalId: req.user._id
    });

    if (!resources) {
      return res.status(404).json({
        success: false,
        message: 'Hospital resources not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Resources retrieved successfully',
      data: resources
    });

  } catch (error) {
    next(error);
  }
};


/**
 * UPDATE One Hospital Resource
 *
 * PUT /api/hospital/resources/:resourceType
 */
export const updateHospitalResource = async (req, res, next) => {
  try {
    const { resourceType } = req.params;

    const resources = await HospitalResource.findOne({
      hospitalId: req.user._id
    });

    if (!resources) {
      return res.status(404).json({
        success: false,
        message: 'Hospital resources not found'
      });
    }


    /*
     * Bed / Ventilator Resources
     */

    const resourceTypes = [
      'icuBeds',
      'traumaBeds',
      'generalBeds',
      'ventilators'
    ];

    if (resourceTypes.includes(resourceType)) {

      const { total, occupied } = req.body;

      // Validate total
      if (!Number.isInteger(total) || total < 0) {
        return res.status(400).json({
          success: false,
          message: 'total must be a non-negative integer'
        });
      }

      // Validate occupied
      if (!Number.isInteger(occupied) || occupied < 0) {
        return res.status(400).json({
          success: false,
          message: 'occupied must be a non-negative integer'
        });
      }

      // Occupied cannot exceed total
      if (occupied > total) {
        return res.status(400).json({
          success: false,
          message: 'occupied cannot be greater than total'
        });
      }

      // Reserved resources are controlled by emergency system
      const currentReserved = resources[resourceType].reserved;

      // Make sure occupied + reserved does not exceed total
      if (occupied + currentReserved > total) {
        return res.status(400).json({
          success: false,
          message:
            'occupied + reserved cannot be greater than total'
        });
      }

      // Update only total and occupied
      resources[resourceType].total = total;
      resources[resourceType].occupied = occupied;

    }


    /*
     * Boolean Resources
     */

    else if (
      resourceType === 'oxygenSupply' ||
      resourceType === 'bloodBank'
    ) {

      const { value } = req.body;

      if (typeof value !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'value must be a boolean'
        });
      }

      resources[resourceType] = value;

    }


    /*
     * Invalid Resource Type
     */

    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid resource type'
      });
    }


    await resources.save();

    return res.status(200).json({
      success: true,
      message: `${resourceType} updated successfully`,
      data: resources
    });

  } catch (error) {
    next(error);
  }
};