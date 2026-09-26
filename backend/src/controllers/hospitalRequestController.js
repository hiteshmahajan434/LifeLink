import HospitalEmergencyRequest from '../models/HospitalEmergencyRequest.js';

export const getHospitalRequests = async (req, res, next) => {
  try {
    const hospitalId = req.user?._id;

    if (!hospitalId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated hospital ID is missing'
      });
    }

    const requests = await HospitalEmergencyRequest.find({
      hospitalId
    })
      .populate({
        path: 'emergencyId',
        select:
          'id ambulanceId location inputs aiParsedRequirements confirmedRequirements status createdAt'
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Hospital requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};