import cloneDeep from 'lodash.clonedeep'

const DEFAULT_MASKED_FIELDS = [
  'seed',
  'secretKey',
  'addressRaw',
];

export function maskPayload (payload: any): any {
  const clonedPayload = cloneDeep(payload);
  const maskedPayload = {}

  if (!clonedPayload) {
    return clonedPayload;
  }

  // maskJSONFields doesn't handle nested objects very well so we'll
  // need to recursively walk to object and mask them one by one
  for (const [property, value] of Object.entries(clonedPayload)) {
    console.log(property, typeof value);
    
    if (value && typeof value === 'object') {
      if (Object.keys(clonedPayload[property]).filter(key => isNaN(parseInt(key))).length === 0) {
        const reconstructedUintArr: number[] = Object.values(clonedPayload[property])
        maskedPayload[property] = "base64:" + Buffer.from(reconstructedUintArr).toString("base64");
      } else {
        maskedPayload[property] = maskPayload(value);
      }
    } else if (value && typeof value === 'string' && DEFAULT_MASKED_FIELDS.includes(property)) {
      maskedPayload[property] = "*".repeat(clonedPayload[property].length)
    } else {
      maskedPayload[property] = value
    }
  }

  return maskedPayload;
}
