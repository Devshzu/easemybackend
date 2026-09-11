import { ContactService } from './contact.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const submitContact = asyncHandler(async (req, res) => {
  const result = await ContactService.processContactSubmission(req.body);
  res.status(201).json(new ApiResponse(201, result, 'Contact inquiry submitted and saved successfully'));
});

export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await ContactService.getAllContacts();
  res.status(200).json(new ApiResponse(200, contacts, 'Contact inquiries retrieved successfully'));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updatedContact = await ContactService.updateContactStatus(id, status);
  res.status(200).json(new ApiResponse(200, updatedContact, 'Contact status updated successfully'));
});

export const deleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await ContactService.deleteContact(id);
  res.status(200).json(new ApiResponse(200, result, 'Contact inquiry deleted successfully'));
});
