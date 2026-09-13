import { Contact } from './contact.model.js';
import { logger } from '../../config/logger.js';
import { mailService } from '../../utils/mailService.js';
import { getContactConfirmationEmailHtml } from '../../utils/emailTemplates/contactConfirmation.template.js';

export class ContactService {
  /**
   * Process and save contact form submission to MongoDB
   * @param {Object} contactData
   */
  static async processContactSubmission(contactData) {
    logger.info('Processing contact form submission:', contactData.email);

    const contactDoc = await Contact.create({
      fullName: contactData.fullName || contactData.name || 'Anonymous',
      email: contactData.email,
      company: contactData.company || '',
      service: contactData.service || 'General Inquiry',
      subject: contactData.subject || '',
      message: contactData.message,
      status: 'new',
    });

    // Send confirmation email to client safely
    if (contactDoc.email) {
      try {
        const html = getContactConfirmationEmailHtml(contactDoc);
        const subject = '[EaseMyWeb] We Received Your Inquiry!';
        await mailService.sendMail({ to: contactDoc.email, subject, html });
      } catch (mailErr) {
        logger.error(`Failed to send contact confirmation email to ${contactDoc.email}: ${mailErr.message}`);
      }
    }

    return {
      received: true,
      referenceId: contactDoc._id.toString(),
      submittedAt: contactDoc.createdAt,
      data: contactDoc,
    };
  }

  /**
   * Retrieve all contact inquiries from MongoDB (sorted by newest first)
   */
  static async getAllContacts() {
    return await Contact.find().sort({ createdAt: -1 });
  }

  /**
   * Update status of a contact inquiry
   * @param {string} id
   * @param {string} status
   */
  static async updateContactStatus(id, status) {
    const validStatuses = ['new', 'in-progress', 'resolved', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updatedDoc = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Contact inquiry not found');
    }

    return updatedDoc;
  }

  /**
   * Delete a contact inquiry from MongoDB
   * @param {string} id
   */
  static async deleteContact(id) {
    const deletedDoc = await Contact.findByIdAndDelete(id);
    if (!deletedDoc) {
      throw new Error('Contact inquiry not found');
    }
    return { deleted: true, id };
  }
}
