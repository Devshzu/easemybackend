import { BlogService } from './blog.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createBlog = asyncHandler(async (req, res) => {
  const blog = await BlogService.createBlog(req.body);
  res.status(201).json(new ApiResponse(201, blog, 'Blog created successfully'));
});

export const getBlogs = asyncHandler(async (req, res) => {
  const isPublic = req.query.public === 'true';
  const blogs = await BlogService.getAllBlogs(isPublic);
  res.status(200).json(new ApiResponse(200, blogs, 'Blogs retrieved successfully'));
});

export const getBlog = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const blog = await BlogService.getBlogByIdOrSlug(idOrSlug);
  const blogData = blog.toObject();
  blogData.commentsCount = blog.comments?.length || 0;
  blogData.likesCount = blog.likedBy?.length || 0;
  delete blogData.comments;
  delete blogData.likedBy;
  res.status(200).json(new ApiResponse(200, blogData, 'Blog retrieved successfully'));
});

export const getComments = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 8, 1), 20);
  const comments = await BlogService.getCommentPage(idOrSlug, page, limit);
  res.status(200).json(new ApiResponse(200, comments, 'Comments retrieved successfully'));
});

export const getLikeStatus = asyncHandler(async (req, res) => {
  const result = await BlogService.getLikeStatus(req.params.idOrSlug, req.query.visitorId);
  res.status(200).json(new ApiResponse(200, result, 'Like status retrieved successfully'));
});

export const toggleLike = asyncHandler(async (req, res) => {
  const result = await BlogService.toggleLike(req.params.idOrSlug, req.body.visitorId);
  res.status(200).json(new ApiResponse(200, result, 'Like updated successfully'));
});

export const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blog = await BlogService.updateBlog(id, req.body);
  res.status(200).json(new ApiResponse(200, blog, 'Blog updated successfully'));
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await BlogService.deleteBlog(id);
  res.status(200).json(new ApiResponse(200, result, 'Blog deleted successfully'));
});

export const addComment = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const { name, message, parentId } = req.body;
  const blog = await BlogService.addComment(idOrSlug, { name, message, parentId });
  res.status(201).json(new ApiResponse(201, blog, 'Comment added successfully'));
});

export const addReply = asyncHandler(async (req, res) => {
  const { idOrSlug, parentId } = req.params;
  const { name, message } = req.body;
  const blog = await BlogService.addComment(idOrSlug, { name, message, parentId });
  res.status(201).json(new ApiResponse(201, blog, 'Reply added successfully'));
});
