// scripts/build-debug.js
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION >>>", err && err.stack ? err.stack : err);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION >>>", err && err.stack ? err.stack : err);
  process.exit(1);
});

(async () => {
  // run Next build programmatically so our handlers catch failures
  const { execa } = await import("execa");
  await execa("next", ["build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: "--trace-uncaught --unhandled-rejections=strict",
    },
  });
})();
