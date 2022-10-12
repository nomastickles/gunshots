export const CSVData1 = `"Incident ID","Incident Date",State,"City Or County",Address,"# Killed","# Injured",Operations
2412785,"September 12, 2022",Florida,"Hollywood (West Park)","4100 block of SW 21st St",3,0,N/A
2412758,"September 12, 2022",Indiana,Indianapolis,"E 18th St and Dequincy St",1,0,N/A
2412750,"September 12, 2022",Ohio,Cleveland,"E 113th St and Benham Ave",0,1,N/A
2412735,"September 12, 2022",Illinois,Chicago,N/A,0,1,N/A
2412712,"September 12, 2022",Illinois,Chicago,"7000 block of S Normal Ave",0,2,N/A
2412708,"September 12, 2022",Florida,"Saint Petersburg","4533 20th Ave N",1,0,N/A
2412702,"September 12, 2022",Maine,Portland,"43 Wharf St",0,2,N/A`;

export const incomingIncident1 = {
  "# Injured": 1,
  "# Killed": 1,
  Address: "address",
  "City Or County": "Cleveland",
  "Incident Date": "September 12, 2022",
  "Incident ID": 2412750,
  Operations: "N/A",
  State: "Ohio",
};

export const incident1 = {
  address: "address",
  city: "Cleveland",
  date: "September 12, 2022",
  id: "setId:2412750",
  image: "https://S3_NAME.s3.amazonaws.com/2412750.jpeg",
  metrics: {
    injured: 1,
    killed: 1,
  },
  state: "Ohio",
};
