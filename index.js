import os from "os";
import io from "socket.io-client";

const socket = io("http://127.0.0.1:8181");

let macAddr = "";

socket.on("connect", async () => {
  const netInterfaces = os.networkInterfaces();

  for (let key in netInterfaces) {
    // For testing purposes
    macAddr = Math.floor(Math.random() * 3) + 1;
    break;
    //End testing purpose code

    if (!netInterfaces[key][0].internal) {
      macAddr = netInterfaces[key][0].mac;
      break;
    }
  }

  socket.emit("initPerfData", { ...(await performanceData()), macAddr });

  const perfDataInterval = setInterval(async () => {
    socket.emit("perfData", await performanceData());
  }, 1000);

  socket.on("disconnect", () => {
    clearInterval(perfDataInterval);
  });
});

const performanceData = async () => {
  // All CPU Infos
  const cpus = os.cpus();

  // Os Type
  const osType = os.type() === "Darwin" ? "MacOS" : os.type();

  // Uptime
  const upTime = os.uptime();

  // Memory Usage
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;

  // Memory used
  const memUsage = Math.floor((usedMem / totalMem) * 100) / 100;
  const cpuModel = cpus[0].model; // CPU model
  const cpuSpeed = cpus[0].speed; // CPU speed
  const numCores = cpus.length;
  const cpuLoad = await getCpuLoad();
  const isActive = true;

  return {
    osType,
    upTime,
    freeMem,
    totalMem,
    usedMem,
    memUsage,
    cpuModel,
    cpuSpeed,
    numCores,
    cpuLoad,
    isActive,
    macAddr,
  };
};

// CPU Load
function getCpuAverage() {
  const cpus = os.cpus();

  let idleTimes = 0;
  let totalTimes = 0;

  cpus.forEach((cpuCore) => {
    for (let modeUsage in cpuCore.times) {
      totalTimes += cpuCore.times[modeUsage];
    }

    idleTimes += cpuCore.times.idle;
  });

  return {
    idle: idleTimes / cpus.length,
    total: totalTimes / cpus.length,
  };
}

function getCpuLoad() {
  return new Promise((resolve, reject) => {
    const start = getCpuAverage();

    setTimeout(async () => {
      const end = getCpuAverage();
      const idleDifference = end.idle - start.idle;
      const totalDifference = end.total - start.total;

      const usedCpuPercent =
        100 - Math.floor((100 * idleDifference) / totalDifference);

      resolve(usedCpuPercent);
    }, 100);
  });
}
