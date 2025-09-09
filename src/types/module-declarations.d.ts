// Temporary module declarations to fix build errors
// These modules are referenced in @captify-io/core but not yet available

declare module '@captify/pmbook' {
  const pmbook: any;
  export default pmbook;
}

declare module '@captify/rmf' {
  const rmf: any;
  export default rmf;
}

// Also declare the correct module names for when core is fixed
declare module '@captify-io/rmf' {
  const rmf: any;
  export default rmf;
}