const re = /^\/(?!api\/|direct-admin|admin\.html).*/;
console.log(re.test("/api/users")); // Should be false
console.log(re.test("/")); // Should be true
console.log(re.test("/login")); // Should be true
console.log(re.test("/api/login")); // Should be false
