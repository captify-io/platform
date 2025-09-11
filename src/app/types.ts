export type AppModule = {
  pageRegistry?: Record<string, () => Promise<any>>;
  componentRegistry?: Record<string, () => Promise<any>>;
};