import { Incident } from "../types";

function getDisplayDates(incidents: Incident[]) {
  interface MonthProps {
    firstDay: string;
    lastDay?: string;
    year: string;
  }

  const temp: Record<string, MonthProps> = {};

  [...incidents].reverse().forEach((item) => {
    const date = item.date;
    const [monthDay, year] = date.split(",");
    const [month, day] = monthDay.split(" ");

    if (!temp[month]) {
      temp[month] = {
        firstDay: day,
        year,
      };
    } else {
      if (day !== temp[month].firstDay) {
        temp[month].lastDay = day;
      }
    }
  });

  return Object.keys(temp)
    .map((month) => {
      let temp1 = `${month} ${temp[month].firstDay}`;
      if (temp[month].lastDay) {
        temp1 += `-${temp[month].lastDay}`;
      }
      temp1 += `, ${temp[month].year}`;
      return temp1;
    })
    .join("   ");
}

export default getDisplayDates;
