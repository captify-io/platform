export { default as PlatformApp } from "./PlatformApp";
export { Dashboard } from "./components/Dashboard";
export { ApplicationManager } from "./components/ApplicationManager";
export { UserManager } from "./components/UserManager";
export { captifyManifest } from "../captify.manifest";

// Default export for the application controller
export default function CaptifyPlatformApp(props: any) {
  const PlatformApp = require("./PlatformApp").default;
  return PlatformApp(props);
}
