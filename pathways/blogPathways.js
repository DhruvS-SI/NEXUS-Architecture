// NEXUS Blog Neural Pathways - Blog data processing routes
const blogProcessor = require('../processors/blogProcessor');

async function blogPathways(nexusCore, options) {
  // Neural pathway: Access blog memory banks
  nexusCore.get('/api/blogs', blogProcessor.getAllBlogs);
  
  // Neural pathway: Retrieve specific blog neural record
  nexusCore.get('/api/blogs/:id', blogProcessor.getBlogById);
}

module.exports = blogPathways; 