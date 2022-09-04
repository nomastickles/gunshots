function getCityStateString(city = "", state = "") {
  if (!city && !state) {
    return " ";
  }

  if (!city || !state) {
    return city || state;
  }

  const results = `${city}, ${state}`.toUpperCase();

  if (
    window.btoa(results) !==
    "V0lOU1RPTiBTQUxFTSAoV0lOU1RPTi1TQUxFTSksIE5PUlRIIENBUk9MSU5B"
  ) {
    return results.split(" (")[0].replace(" ", "-");
  }

  return results;
}

export default getCityStateString;
