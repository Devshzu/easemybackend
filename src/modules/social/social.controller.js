import { SocialService } from './social.service.js';
import { generateManualSocialPost, regenerateSocialPost } from './social.generator.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getPosts = asyncHandler(async (req, res) => {
  const result = await SocialService.getPosts({
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    category: req.query.category,
    platform: req.query.platform,
    search: req.query.search,
  });
  res.status(200).json(
    new ApiResponse(200, result.posts, 'Social posts retrieved successfully', result.pagination)
  );
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await SocialService.getPostById(req.params.id);
  res.status(200).json(new ApiResponse(200, post, 'Social post retrieved successfully'));
});

export const generatePost = asyncHandler(async (req, res) => {
  const { topic, category, generationType, platform } = req.body;
  if (!topic) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Topic is required to generate a social post',
    });
  }
  const post = await generateManualSocialPost({ topic, category, generationType, platform });
  res.status(201).json(new ApiResponse(201, post, 'Social post generated successfully'));
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await SocialService.updatePost(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, post, 'Social post updated successfully'));
});

export const deletePost = asyncHandler(async (req, res) => {
  await SocialService.deletePost(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Social post deleted successfully'));
});

export const regeneratePost = asyncHandler(async (req, res) => {
  const { mode = 'both' } = req.body;
  const post = await regenerateSocialPost(req.params.id, mode);
  res.status(200).json(new ApiResponse(200, post, `Social post ${mode} regenerated successfully`));
});

export const approvePost = asyncHandler(async (req, res) => {
  const post = await SocialService.approvePost(req.params.id);
  res.status(200).json(new ApiResponse(200, post, 'Social post approved successfully'));
});

export const schedulePost = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;
  const post = await SocialService.schedulePost(req.params.id, scheduledAt);
  res.status(200).json(new ApiResponse(200, post, 'Social post scheduled successfully'));
});

export const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await SocialService.getAccounts();
  res.status(200).json(new ApiResponse(200, accounts, 'Social accounts retrieved successfully'));
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await SocialService.createAccount(req.body);
  res.status(201).json(new ApiResponse(201, account, 'Social account created successfully'));
});

export const updateAccount = asyncHandler(async (req, res) => {
  const account = await SocialService.updateAccount(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, account, 'Social account updated successfully'));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await SocialService.deleteAccount(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Social account deleted successfully'));
});
