const getDifferentTimePeriods = () => {
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const currectTime = new Date(Date.now() + IST_OFFSET);

  const lastWeek = new Date(
    new Date(
      new Date(currectTime.getTime() - 1000 * 60 * 60 * 24 * 7).setHours(
        0,
        0,
        0,
        0
      )
    ).getTime() + IST_OFFSET
  );
  const lastThirtyDays = new Date(
    new Date(
      new Date(currectTime.getTime() - 1000 * 60 * 60 * 24 * 30).setHours(
        0,
        0,
        0,
        0
      )
    ).getTime() + IST_OFFSET
  );

  const currentMonth = new Date(
    new Date(
      currectTime.getFullYear(),
      currectTime.getMonth(),
      1
    ).getTime() + IST_OFFSET
  );

  const startTime = new Date(
    new Date(
      currectTime.getFullYear(),
      currectTime.getMonth(),
      currectTime.getDate() + 1,
      0,
      0,
      0,
      0
    ).getTime() + IST_OFFSET
  );

  return { startTime, currectTime, lastWeek, currentMonth, lastThirtyDays };
};

module.exports = {
  getDifferentTimePeriods,
};
