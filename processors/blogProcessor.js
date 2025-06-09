// NEXUS Blog Processor - Specialized neural unit for blog data processing
const blogsData = require('../memory-banks/blogsData');

class BlogProcessor {
  // Neural function: Process and filter blog memory banks
  async getAllBlogs(request, reply) {
    try {
      // Extract neural parameters from request
      const { author, tag, limit } = request.query;
      
      // Access blog memory banks
      let filteredBlogs = [...blogsData];
      
      // Apply neural filtering algorithms
      if (author) {
        filteredBlogs = filteredBlogs.filter(blog => 
          blog.author.toLowerCase().includes(author.toLowerCase())
        );
      }
      
      if (tag) {
        filteredBlogs = filteredBlogs.filter(blog => 
          blog.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
        );
      }
      
      if (limit) {
        const limitNum = parseInt(limit);
        filteredBlogs = filteredBlogs.slice(0, limitNum);
      }
      
      // Neural response formatting
      return {
        success: true,
        data: filteredBlogs,
        total: filteredBlogs.length,
        processor: 'NEXUS Blog Processor',
        memory_bank: 'blogs',
        neural_filters_applied: {
          author: author || null,
          tag: tag || null,
          limit: limit || null
        }
      };
    } catch (error) {
      request.log.error('🧠 Blog processor error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Neural processing error in blog processor',
        processor: 'NEXUS Blog Processor'
      });
    }
  }

  // Neural function: Retrieve specific blog record from memory banks
  async getBlogById(request, reply) {
    try {
      const { id } = request.params;
      const blogId = parseInt(id);
      
      // Search memory banks for specific neural record
      const blog = blogsData.find(blog => blog.id === blogId);
      
      if (!blog) {
        return reply.status(404).send({
          success: false,
          error: 'Blog neural record not found in memory banks',
          processor: 'NEXUS Blog Processor',
          searched_id: blogId
        });
      }
      
      // Return neural record
      return {
        success: true,
        data: blog,
        processor: 'NEXUS Blog Processor',
        memory_bank: 'blogs',
        record_id: blogId
      };
    } catch (error) {
      request.log.error('🧠 Blog processor error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Neural processing error in blog processor',
        processor: 'NEXUS Blog Processor'
      });
    }
  }
}

module.exports = new BlogProcessor(); 