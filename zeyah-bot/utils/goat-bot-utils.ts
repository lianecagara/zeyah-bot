// from ntkhang03/Goat-Bot-V2
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import Stream from "node:stream";
import cheerio from "cheerio";
export async function getStreamFromUrl(
  url: string,
  pathName: string,
  options: Partial<AxiosRequestConfig>,
): Promise<Stream>;
export function getStreamFromUrl(
  url: string,
  options?: Partial<AxiosRequestConfig>,
): Promise<Stream>;

export async function getStreamFromUrl(
  url: string,
  pathNameOrOptions?: string | Partial<AxiosRequestConfig>,
  options?: Partial<AxiosRequestConfig>,
): Promise<Stream> {
  if (!url || typeof url !== "string") {
    throw new Error("The first argument (url) must be a string");
  }

  let pathName = "";
  let requestOptions: Partial<AxiosRequestConfig> = {};

  if (typeof pathNameOrOptions === "string") {
    pathName = pathNameOrOptions;
    requestOptions = options || {};
  } else if (pathNameOrOptions && typeof pathNameOrOptions === "object") {
    requestOptions = pathNameOrOptions;
  }

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      ...requestOptions,
    });

    if (!pathName) {
      pathName =
        utils.randomString(10) +
        (response.headers["content-type"]
          ? "." + utils.getExtFromMimeType(response.headers["content-type"])
          : ".noext");
    }

    response.data.path = pathName;
    return response.data;
  } catch (err) {
    throw err;
  }
}
export interface FullGetStreamResult {
  contentType: string;
  stream: Stream;
  pathName: string;
  fullResponse: AxiosResponse<Stream>;
  extension: string;
}
export async function getStreamFromUrlFull(
  url: string,
  pathName: string,
  options: Partial<AxiosRequestConfig>,
): Promise<FullGetStreamResult>;
export function getStreamFromUrlFull(
  url: string,
  options?: Partial<AxiosRequestConfig>,
): Promise<FullGetStreamResult>;

export async function getStreamFromUrlFull(
  url: string,
  pathNameOrOptions?: string | Partial<AxiosRequestConfig>,
  options?: Partial<AxiosRequestConfig>,
): Promise<FullGetStreamResult> {
  if (!url || typeof url !== "string") {
    throw new Error("The first argument (url) must be a string");
  }

  let pathName = "";
  let requestOptions: Partial<AxiosRequestConfig> = {};

  if (typeof pathNameOrOptions === "string") {
    pathName = pathNameOrOptions;
    requestOptions = options || {};
  } else if (pathNameOrOptions && typeof pathNameOrOptions === "object") {
    requestOptions = pathNameOrOptions;
  }

  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
      ...requestOptions,
    });
    const ext = response.headers["content-type"]
      ? "." + utils.getExtFromMimeType(response.headers["content-type"])
      : ".noext";

    if (!pathName) {
      pathName = utils.randomString(10) + ext;
    }

    response.data.path = pathName;
    return {
      contentType: response.headers["content-type"],
      extension: ext,
      fullResponse: response,
      pathName,
      stream: response.data,
    };
  } catch (err) {
    throw err;
  }
}
import mimeDB from "mime-db";
export { getStreamFromUrl as getStreamFromURL };

export function getExtFromMimeType(mimeType = "") {
  return Reflect.has(mimeDB, mimeType)
    ? ((Reflect.get(mimeDB, mimeType)?.extensions ?? [])[0] ?? "unknow")
    : "unknow";
}

export function getExtFromUrl(url: string = "") {
  if (!url || typeof url !== "string")
    throw new Error("The first argument (url) must be a string");
  const reg =
    /(?<=https:\/\/cdn.fbsbx.com\/v\/.*?\/|https:\/\/video.xx.fbcdn.net\/v\/.*?\/|https:\/\/scontent.xx.fbcdn.net\/v\/.*?\/).*?(\/|\?)/g;
  const fileName = url.match(reg)[0].slice(0, -1);
  return fileName.slice(fileName.lastIndexOf(".") + 1);
}

export function removeHomeDir(fullPath: string) {
  if (!fullPath || typeof fullPath !== "string")
    throw new Error("The first argument (fullPath) must be a string");
  while (fullPath.includes(process.cwd()))
    fullPath = fullPath.replace(process.cwd(), "");
  return fullPath;
}

export async function translateAPI(text: string, lang: string) {
  try {
    const res = await axios.get(
      "https://translate.googleapis.com/translate_a/single",
      {
        params: {
          client: "gtx",
          sl: "auto",
          tl: lang,
          dt: "t",
          q: text,
        },
      },
    );
    return res.data[0][0][0];
  } catch (err) {
    throw err;
  }
}

export async function findUid(link: string) {
  try {
    const response = await axios.post(
      "https://seomagnifier.com/fbid",
      new URLSearchParams({
        facebook: "1",
        sitelink: link,
      }),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: "PHPSESSID=0d8feddd151431cf35ccb0522b056dc6",
        },
      },
    );
    const id = response.data;
    if (isNaN(id)) {
      const html = await axios.get(link);
      const $ = cheerio.load(html.data);
      const el = $('meta[property="al:android:url"]').attr("content");
      if (!el) {
        throw new Error("UID not found");
      }
      const number = el.split("/").pop();
      return number;
    }
    return id;
  } catch (error) {
    throw new Error("An unexpected error occurred. Please try again.");
  }
}

export interface DuckAttachment {
  url: string;
}

export type DuckAttachments = DuckAttachment[];

export interface StreamResult {
  pending: AxiosResponse;
  fileName: string;
}
export interface StreamResultWIP {
  pending: Promise<AxiosResponse>;
  fileName: string;
}

export async function getStreamsFromAttachment(attachments: DuckAttachments) {
  const wips: StreamResultWIP[] = [];
  for (const attachment of attachments) {
    const url = attachment.url;
    const ext = utils.getExtFromUrl(url);
    const fileName = `${utils.randomString(10)}.${ext}`;
    wips.push({
      pending: axios({
        url,
        method: "GET",
        responseType: "stream",
      }),
      fileName,
    });
  }
  const streams: StreamResult[] = [];

  for (let i = 0; i < streams.length; i++) {
    const stream = await wips[i].pending;
    stream.data.path = wips[i].fileName;
    streams[i] = stream.data;
  }
  return streams;
}

export async function shortenURL(url: string) {
  try {
    const result = await axios.get(`https://tinyurl.com/api-create.php?`, {
      params: [url],
    });
    return result.data;
  } catch (err) {
    let error;
    if (err instanceof AxiosError && err.response) {
      error = new Error();
      Object.assign(error, err.response.data);
    }
    throw error;
  }
}

export async function uploadImgbb(file: string | Stream) {
  let type = "file";
  try {
    if (!file)
      throw new Error(
        "The first argument (file) must be a stream or a image url",
      );
    if (typeof file === "string" && regCheckURL.test(file) == true)
      type = "url";
    if (
      (type != "url" &&
        !(
          typeof file !== "string" &&
          "_read" in file &&
          "_readableState" in file &&
          typeof file._read === "function" &&
          typeof file._readableState === "object"
        )) ||
      (type == "url" && !regCheckURL.test(file as string))
    )
      throw new Error(
        "The first argument (file) must be a stream or an image URL",
      );

    const res_ = await axios({
      method: "GET",
      url: "https://imgbb.com",
    });

    const auth_token = res_.data.match(/auth_token="([^"]+)"/)[1];
    const timestamp = Date.now();

    const res = await axios({
      method: "POST",
      url: "https://imgbb.com/json",
      headers: {
        "content-type": "multipart/form-data",
      },
      data: {
        source: file,
        type: type,
        action: "upload",
        timestamp: timestamp,
        auth_token: auth_token,
      },
    });

    return res.data as IMGBB.UploadImageResponse;
    // {
    // 	"status_code": 200,
    // 	"success": {
    // 		"message": "image uploaded",
    // 		"code": 200
    // 	},
    // 	"image": {
    // 		"name": "Banner-Project-Goat-Bot",
    // 		"extension": "png",
    // 		"width": 2560,
    // 		"height": 1440,
    // 		"size": 194460,
    // 		"time": 1688352855,
    // 		"expiration": 0,
    // 		"likes": 0,
    // 		"description": null,
    // 		"original_filename": "Banner Project Goat Bot.png",
    // 		"is_animated": 0,
    // 		"is_360": 0,
    // 		"nsfw": 0,
    // 		"id_encoded": "D1yzzdr",
    // 		"size_formatted": "194.5 KB",
    // 		"filename": "Banner-Project-Goat-Bot.png",
    // 		"url": "https://i.ibb.co/wdXBBtc/Banner-Project-Goat-Bot.png",  // => this is url image
    // 		"url_viewer": "https://ibb.co/D1yzzdr",
    // 		"url_viewer_preview": "https://ibb.co/D1yzzdr",
    // 		"url_viewer_thumb": "https://ibb.co/D1yzzdr",
    // 		"image": {
    // 			"filename": "Banner-Project-Goat-Bot.png",
    // 			"name": "Banner-Project-Goat-Bot",
    // 			"mime": "image/png",
    // 			"extension": "png",
    // 			"url": "https://i.ibb.co/wdXBBtc/Banner-Project-Goat-Bot.png",
    // 			"size": 194460
    // 		},
    // 		"thumb": {
    // 			"filename": "Banner-Project-Goat-Bot.png",
    // 			"name": "Banner-Project-Goat-Bot",
    // 			"mime": "image/png",
    // 			"extension": "png",
    // 			"url": "https://i.ibb.co/D1yzzdr/Banner-Project-Goat-Bot.png"
    // 		},
    // 		"medium": {
    // 			"filename": "Banner-Project-Goat-Bot.png",
    // 			"name": "Banner-Project-Goat-Bot",
    // 			"mime": "image/png",
    // 			"extension": "png",
    // 			"url": "https://i.ibb.co/tHtQQRL/Banner-Project-Goat-Bot.png"
    // 		},
    // 		"display_url": "https://i.ibb.co/tHtQQRL/Banner-Project-Goat-Bot.png",
    // 		"display_width": 2560,
    // 		"display_height": 1440,
    // 		"delete_url": "https://ibb.co/D1yzzdr/<TOKEN>",
    // 		"views_label": "lượt xem",
    // 		"likes_label": "thích",
    // 		"how_long_ago": "mới đây",
    // 		"date_fixed_peer": "2023-07-03 02:54:15",
    // 		"title": "Banner-Project-Goat-Bot",
    // 		"title_truncated": "Banner-Project-Goat-Bot",
    // 		"title_truncated_html": "Banner-Project-Goat-Bot",
    // 		"is_use_loader": false
    // 	},
    // 	"request": {
    // 		"type": "file",
    // 		"action": "upload",
    // 		"timestamp": "1688352853967",
    // 		"auth_token": "a2606b39536a05a81bef15558bb0d61f7253dccb"
    // 	},
    // 	"status_txt": "OK"
    // }
  } catch (err) {
    throw err;
  }
}

export namespace IMGBB {
  export const upload = uploadImgbb;
  interface UploadSuccess {
    message: string;
    code: number;
  }

  interface ImageMeta {
    filename: string;
    name: string;
    mime: string;
    extension: string;
    url: string;
    size: number;
  }

  interface ImageSizeVariant {
    filename: string;
    name: string;
    mime: string;
    extension: string;
    url: string;
  }

  interface ImageResponse {
    name: string;
    extension: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    likes: number;
    description: string | null;
    original_filename: string;
    is_animated: number;
    is_360: number;
    nsfw: number;
    id_encoded: string;
    size_formatted: string;
    filename: string;
    url: string;
    url_viewer: string;
    url_viewer_preview: string;
    url_viewer_thumb: string;

    image: ImageMeta;
    thumb: ImageSizeVariant;
    medium: ImageSizeVariant;

    display_url: string;
    display_width: number;
    display_height: number;
    delete_url: string;

    views_label: string;
    likes_label: string;
    how_long_ago: string;

    date_fixed_peer: string;
    title: string;
    title_truncated: string;
    title_truncated_html: string;

    is_use_loader: boolean;
  }

  interface UploadRequest {
    type: string;
    action: string;
    timestamp: string;
    auth_token: string;
  }

  export interface UploadImageResponse {
    status_code: number;
    success: UploadSuccess;
    image: ImageResponse;
    request: UploadRequest;
    status_txt: string;
  }
}

export async function uploadZippyshare(stream: Stream) {
  const res = await axios({
    method: "POST",
    url: "https://api.zippysha.re/upload",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: {
      file: stream,
    },
  });

  const fullUrl = res.data.data.file.url.full;
  const res_ = await axios({
    method: "GET",
    url: fullUrl,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43",
    },
  });

  const downloadUrl = res_.data.match(
    /id="download-url"(?:.|\n)*?href="(.+?)"/,
  )[1];
  res.data.data.file.url.download = downloadUrl;

  return res.data;
}

export const regCheckURL =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

export function lengthWhiteSpacesEndLine(text: string) {
  let length = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] == " ") length++;
    else break;
  }
  return length;
}

export function lengthWhiteSpacesStartLine(text: string) {
  let length = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] == " ") length++;
    else break;
  }
  return length;
}

export function convertTime(
  miliSeconds: number,
  replaceSeconds = "s",
  replaceMinutes = "m",
  replaceHours = "h",
  replaceDays = "d",
  replaceMonths = "M",
  replaceYears = "y",
  notShowZero = false,
) {
  if (typeof replaceSeconds == "boolean") {
    notShowZero = replaceSeconds;
    replaceSeconds = "s";
  }
  const second = Math.floor((miliSeconds / 1000) % 60);
  const minute = Math.floor((miliSeconds / 1000 / 60) % 60);
  const hour = Math.floor((miliSeconds / 1000 / 60 / 60) % 24);
  const day = Math.floor((miliSeconds / 1000 / 60 / 60 / 24) % 30);
  const month = Math.floor((miliSeconds / 1000 / 60 / 60 / 24 / 30) % 12);
  const year = Math.floor(miliSeconds / 1000 / 60 / 60 / 24 / 30 / 12);
  let formattedDate = "";

  const dateParts = [
    { value: year, replace: replaceYears },
    { value: month, replace: replaceMonths },
    { value: day, replace: replaceDays },
    { value: hour, replace: replaceHours },
    { value: minute, replace: replaceMinutes },
    { value: second, replace: replaceSeconds },
  ];

  for (let i = 0; i < dateParts.length; i++) {
    const datePart = dateParts[i];
    if (datePart.value) formattedDate += datePart.value + datePart.replace;
    else if (formattedDate != "") formattedDate += "00" + datePart.replace;
    else if (i == dateParts.length - 1) formattedDate += "0" + datePart.replace;
  }

  if (formattedDate == "") formattedDate = "0" + replaceSeconds;

  if (notShowZero) formattedDate = formattedDate.replace(/00\w+/g, "");

  return formattedDate;
}

export function formatNumber(number: number) {
  if (isNaN(number))
    throw new Error("The first argument (number) must be a number");

  number = Number(number);
  return number.toLocaleString("en-US");
}

export function getExtFromAttachmentType(type: string) {
  switch (type) {
    case "photo":
      return "png";
    case "animated_image":
      return "gif";
    case "video":
      return "mp4";
    case "audio":
      return "mp3";
    default:
      return "txt";
  }
}

export const WordCleanerDict = [
  "A",
  "Á",
  "À",
  "Ả",
  "Ã",
  "Ạ",
  "a",
  "á",
  "à",
  "ả",
  "ã",
  "ạ",
  "Ă",
  "Ắ",
  "Ằ",
  "Ẳ",
  "Ẵ",
  "Ặ",
  "ă",
  "ắ",
  "ằ",
  "ẳ",
  "ẵ",
  "ặ",
  "Â",
  "Ấ",
  "Ầ",
  "Ẩ",
  "Ẫ",
  "Ậ",
  "â",
  "ấ",
  "ầ",
  "ẩ",
  "ẫ",
  "ậ",
  "B",
  "b",
  "C",
  "c",
  "D",
  "Đ",
  "d",
  "đ",
  "E",
  "É",
  "È",
  "Ẻ",
  "Ẽ",
  "Ẹ",
  "e",
  "é",
  "è",
  "ẻ",
  "ẽ",
  "ẹ",
  "Ê",
  "Ế",
  "Ề",
  "Ể",
  "Ễ",
  "Ệ",
  "ê",
  "ế",
  "ề",
  "ể",
  "ễ",
  "ệ",
  "F",
  "f",
  "G",
  "g",
  "H",
  "h",
  "I",
  "Í",
  "Ì",
  "Ỉ",
  "Ĩ",
  "Ị",
  "i",
  "í",
  "ì",
  "ỉ",
  "ĩ",
  "ị",
  "J",
  "j",
  "K",
  "k",
  "L",
  "l",
  "M",
  "m",
  "N",
  "n",
  "O",
  "Ó",
  "Ò",
  "Ỏ",
  "Õ",
  "Ọ",
  "o",
  "ó",
  "ò",
  "ỏ",
  "õ",
  "ọ",
  "Ô",
  "Ố",
  "Ồ",
  "Ổ",
  "Ỗ",
  "Ộ",
  "ô",
  "ố",
  "ồ",
  "ổ",
  "ỗ",
  "ộ",
  "Ơ",
  "Ớ",
  "Ờ",
  "Ở",
  "Ỡ",
  "Ợ",
  "ơ",
  "ớ",
  "ờ",
  "ở",
  "ỡ",
  "ợ",
  "P",
  "p",
  "Q",
  "q",
  "R",
  "r",
  "S",
  "s",
  "T",
  "t",
  "U",
  "Ú",
  "Ù",
  "Ủ",
  "Ũ",
  "Ụ",
  "u",
  "ú",
  "ù",
  "ủ",
  "ũ",
  "ụ",
  "Ư",
  "Ứ",
  "Ừ",
  "Ử",
  "Ữ",
  "Ự",
  "ư",
  "ứ",
  "ừ",
  "ử",
  "ữ",
  "ự",
  "V",
  "v",
  "W",
  "w",
  "X",
  "x",
  "Y",
  "Ý",
  "Ỳ",
  "Ỷ",
  "Ỹ",
  "Ỵ",
  "y",
  "ý",
  "ỳ",
  "ỷ",
  "ỹ",
  "ỵ",
  "Z",
  "z",
  " ",
];

export async function translate(text: string, lang: string) {
  const word = WordCleanerDict;
  if (typeof text !== "string")
    throw new Error(`The first argument (text) must be a string`);
  if (!lang) lang = "en";
  if (typeof lang !== "string")
    throw new Error(`The second argument (lang) must be a string`);
  const wordTranslate = [""];
  const wordNoTranslate = [""];
  const wordTransAfter = [];
  let lastPosition = "wordTranslate";

  if (word.indexOf(text.charAt(0)) == -1) wordTranslate.push("");
  else wordNoTranslate.splice(0, 1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (word.indexOf(char) !== -1) {
      // is word
      const lengWordNoTranslate = wordNoTranslate.length - 1;
      if (
        wordNoTranslate[lengWordNoTranslate] &&
        wordNoTranslate[lengWordNoTranslate].includes("{") &&
        !wordNoTranslate[lengWordNoTranslate].includes("}")
      ) {
        wordNoTranslate[lengWordNoTranslate] += char;
        continue;
      }
      const lengWordTranslate = wordTranslate.length - 1;
      if (lastPosition == "wordTranslate") {
        wordTranslate[lengWordTranslate] += char;
      } else {
        wordTranslate.push(char);
        lastPosition = "wordTranslate";
      }
    } else {
      // is no word
      const lengWordNoTranslate = wordNoTranslate.length - 1;
      const twoWordLast = wordNoTranslate[lengWordNoTranslate]?.slice(-2) || "";
      if (lastPosition == "wordNoTranslate") {
        if (twoWordLast == "}}") {
          wordTranslate.push("");
          wordNoTranslate.push(char);
        } else wordNoTranslate[lengWordNoTranslate] += char;
      } else {
        wordNoTranslate.push(char);
        lastPosition = "wordNoTranslate";
      }
    }
  }

  for (let i = 0; i < wordTranslate.length; i++) {
    const text = wordTranslate[i];
    if (!text.match(/[^\s]+/)) wordTransAfter.push(text);
    else wordTransAfter.push(utils.translateAPI(text, lang));
  }

  let output = "";

  for (let i = 0; i < wordTransAfter.length; i++) {
    let wordTrans = await wordTransAfter[i];
    if (wordTrans.trim().length === 0) {
      output += wordTrans;
      if (wordNoTranslate[i] != undefined) output += wordNoTranslate[i];
      continue;
    }

    wordTrans = wordTrans.trim();
    const numberStartSpace = lengthWhiteSpacesStartLine(wordTranslate[i]);
    const numberEndSpace = lengthWhiteSpacesEndLine(wordTranslate[i]);

    wordTrans =
      " ".repeat(numberStartSpace) +
      wordTrans.trim() +
      " ".repeat(numberEndSpace);

    output += wordTrans;
    if (wordNoTranslate[i] != undefined) output += wordNoTranslate[i];
  }
  return output;
}
