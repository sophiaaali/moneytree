import Cookies from "js-cookie";

export function addLoginCookie(uid: string): void {
  Cookies.set("uid", uid);
}

export function removeLoginCookie(): void {
  Cookies.remove("uid");
}

// export function getLoginCookie(): string | undefined {
//   // TODO: fill out!
//   return Cookies.get("uid");
// }

export function getLoginCookie(): string | undefined {
  const cookie = Cookies.get("uid");
  console.log("Retrieved cookie:", cookie);
  return cookie;
}
