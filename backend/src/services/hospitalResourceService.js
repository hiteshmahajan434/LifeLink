import HospitalResource from '../models/HospitalResource.js';


/*
 * Move reserved resources to occupied resources
 * after ambulance handover is completed.
 */

export const completeResourceHandover = async ({
  hospitalId,
  requiredResources
}) => {

  const hospitalResource =
    await HospitalResource.findOne({
      hospitalId
    });

  if (!hospitalResource) {
    throw new Error(
      'Hospital resources not found'
    );
  }


  const numericResources = [
    'icuBeds',
    'traumaBeds',
    'generalBeds',
    'ventilators'
  ];


  // ----------------------------------------------
  // Validate reserved resources
  // ----------------------------------------------

  for (const resourceType of numericResources) {

    const requiredAmount =
      requiredResources[resourceType] ?? 0;

    if (requiredAmount === 0) {
      continue;
    }


    const resource =
      hospitalResource[resourceType];

    if (!resource) {
      throw new Error(
        `${resourceType} resource not found`
      );
    }


    if (
      resource.reserved <
      requiredAmount
    ) {
      throw new Error(
        `Insufficient reserved ${resourceType}`
      );
    }
  }


  // ----------------------------------------------
  // Move RESERVED → OCCUPIED
  // ----------------------------------------------

  for (const resourceType of numericResources) {

    const requiredAmount =
      requiredResources[resourceType] ?? 0;

    if (requiredAmount === 0) {
      continue;
    }


    const resource =
      hospitalResource[resourceType];


    resource.reserved -=
      requiredAmount;

    resource.occupied +=
      requiredAmount;
  }


  await hospitalResource.save();


  return hospitalResource;
};