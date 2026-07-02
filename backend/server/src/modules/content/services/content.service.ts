import { getOrCreateSiteContent } from '../../../models/site-content.model';
import { AboutBlockDTO, ContactInfoDTO } from '../content.types';

export const getAboutContent = async (): Promise<AboutBlockDTO[]> => {
  const doc = await getOrCreateSiteContent();
  return doc.about_blocks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((b) => ({
      id:      b._id.toString(),
      type:    b.type,
      text:    b.text,
      url:     b.url,
      caption: b.caption,
      float:   b.float,
      order:   b.order,
    }));
};

export const getContactInfo = async (): Promise<ContactInfoDTO> => {
  const doc = await getOrCreateSiteContent();
  return {
    phone:   doc.contact_phone ?? '',
    email:   doc.contact_email ?? '',
    address: doc.contact_address ?? '',
  };
};
