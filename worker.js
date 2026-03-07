export default {
  async fetch(request, env, ctx) {
    return new Response(
      "This application is hosted on Render. Please visit: https://familia-mazarrasa.onrender.com",
      {
        headers: { "content-type": "text/plain" },
        status: 200,
      }
    );
  },
};
