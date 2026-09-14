import { Router } from 'express';
import { generateAndWriteSitemap } from './sitemap.generator.js';

const router = Router();

router.get('/refresh', async (req, res) => {
  try {
    const result = await generateAndWriteSitemap({
      baseUrl: req.query.baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://easemyweb.in',
    });

    res.status(200).json({
      success: true,
      message: 'Sitemap regenerated successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Sitemap regeneration failed',
    });
  }
});

export default router;
