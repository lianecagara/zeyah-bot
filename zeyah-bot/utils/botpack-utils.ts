import axios, { Axios, AxiosRequestConfig } from "axios";

export function convertHMS(value: string | number) {
  const sec = typeof value === "number" ? value : parseInt(value, 10);
  let hours: number | string = Math.floor(sec / 3600);
  let minutes: number | string = Math.floor((sec - hours * 3600) / 60);
  let seconds: number | string = sec - hours * 3600 - minutes * 60;
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  return (hours != "00" ? hours + ":" : "") + minutes + ":" + seconds;
}

export async function removeSpecialChar(str: string) {
  if (str === null || str === "") return false;
  else str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, "");
}
export function removeSpecialCharSync(str: string) {
  if (str === null || str === "") return false;
  else str = str.toString();

  return str.replace(/[^\x20-\x7E]/g, "");
}

export function cleanAnilistHTML(text: string) {
  text = text
    .replace("<br>", "\n")
    .replace(/<\/?(i|em)>/g, "*")
    .replace(/<\/?b>/g, "**")
    .replace(/~!|!~/g, "||")
    .replace("&amp;", "&")
    .replace("&lt;", "<")
    .replace("&gt;", ">")
    .replace("&quot;", '"')
    .replace("&#039;", "'");
  return text;
}

export async function downloadFile(url: string, path: string) {
  const { createWriteStream } = require("fs");

  const response = await axios({
    method: "GET",
    responseType: "stream",
    url,
  });

  const writer = createWriteStream(path);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

export async function getContent<T>(
  url: string,
  params: AxiosRequestConfig["params"] = {},
) {
  try {
    const response = await axios.get<T>(url, {
      params,
    });

    return response.data;
  } catch (e) {
    console.log(e);
  }
}

export function randomString(length: number | string) {
  length = Number(length);
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length || 5;
  for (var i = 0; i < length; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
}
