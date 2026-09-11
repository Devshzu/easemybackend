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
  res.status(200).json(new ApiResponse(200, blog, 'Blog retrieved successfully'));
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
