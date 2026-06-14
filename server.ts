import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './src/db';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { sendMail } from './src/utils/mailer';


const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-gigpath';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const getAuthToken = (req: any): string | undefined => {
  let token = req.cookies?.auth_token;
  if (!token && req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }
  if (!token) {
    token = req.headers?.['x-auth-token'];
  }
  return token;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // API Routes
  app.post('/api/auth/register', async (req, res) => {
    let { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tüm alanları doldurunuz.' });
    }

    email = email.trim().toLowerCase();

    try {
      const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
      }

      const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.prepare('INSERT INTO users (id, name, email, password, is_verified, verification_code) VALUES (?, ?, ?, ?, 1, NULL)').run(id, name, email, hashedPassword);
      
      const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.json({ 
        message: 'Kayıt başarılı! Giriş yapıldı.', 
        token,
        user: { id, name, email, is_verified: 1 }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
  });

  app.post('/api/auth/verify-email', (req, res) => {
    let { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'E-posta ve doğrulama kodu gereklidir.' });
    }

    email = email.trim().toLowerCase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }

      if (user.verification_code !== code) {
        return res.status(400).json({ error: 'Girdiğiniz doğrulama kodu hatalı.' });
      }

      // Update as verified
      db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?').run(user.id);

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({ 
        message: 'Doğrulama başarılı, giriş yapıldı.', 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Doğrulama sırasında hata oluştu.' });
    }
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-posta parametresi gereklidir.' });
    }

    email = email.trim().toLowerCase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      db.prepare('UPDATE users SET verification_code = ? WHERE id = ?').run(verificationCode, user.id);

      let mailSent = false;
      let mailError: string | undefined;

      const mailResult = await sendMail({
        to: email,
        subject: 'gigpath - E-posta Doğrulama Kodu',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: -0.025em;">gig<span style="color: #ffffff; font-weight: 300;">path</span></h1>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; font-family: monospace;">Freelance Asistanı</p>
            </div>
            <div style="background-color: #020617; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center;">
              <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; margin-bottom: 8px;">Yeni Doğrulama Kodu</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Merhaba <strong>${user.name}</strong>,<br/>Talebiniz üzerine yeni bir doğrulama kodu oluşturuldu. Platforma giriş yapmak için lütfen aşağıdaki 6 haneli doğrulama kodunu kullanın:</p>
              <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; display: inline-block; font-family: monospace; font-size: 32px; font-weight: bold; color: #60a5fa; letter-spacing: 0.2em; border: 1px solid #1e293b;">
                ${verificationCode}
              </div>
              <p style="color: #e2e8f0; font-size: 12px; margin-top: 24px; margin-bottom: 0;">Bu kod 15 dakika boyunca geçerlidir.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
              Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevap vermeyiniz.<br/>
              &copy; 2026 gigpath. Tüm hakları saklıdır.
            </div>
          </div>
        `
      });

      if (mailResult.success) {
        mailSent = true;
      } else {
        console.info('[AUTH RESEND] Mail sending skipped/failed (simulated mode used):', mailResult.error);
        mailError = mailResult.error;
      }

      res.json({
        message: mailSent 
          ? 'Yeni doğrulama kodu e-posta adresinize gönderildi.' 
          : 'Doğrulama kodu yeniden üretildi. E-posta sunucusu henüz yapılandırılmadığı için simüle edildi.',
        simulated_code: mailSent ? undefined : verificationCode,
        mail_sent: mailSent,
        mail_error: mailError
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Kod gönderilirken hata oluştu.' });
    }
  });

  app.post('/api/auth/forgot-password-send', async (req, res) => {
    let { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'E-posta adresi gereklidir.' });
    }

    email = email.trim().toLowerCase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(404).json({ error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.' });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      db.prepare('UPDATE users SET reset_code = ? WHERE id = ?').run(resetCode, user.id);

      let mailSent = false;
      let mailError: string | undefined;

      const mailResult = await sendMail({
        to: email,
        subject: 'gigpath - Şifre Sıfırlama Kodu',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: 700; letter-spacing: -0.025em;">gig<span style="color: #ffffff; font-weight: 300;">path</span></h1>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 4px; text-transform: uppercase; font-family: monospace;">Freelance Asistanı</p>
            </div>
            <div style="background-color: #020617; border-radius: 12px; padding: 20px; border: 1px solid #334155; text-align: center;">
              <h2 style="font-size: 18px; color: #ffffff; margin-top: 0; margin-bottom: 8px;">Şifrenizi Sıfırlayın</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">Merhaba <strong>${user.name}</strong>,<br/>Şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlayıp yeni bir şifre tanımlamak için lütfen aşağıdaki 6 haneli kodu kullanın:</p>
              <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; display: inline-block; font-family: monospace; font-size: 32px; font-weight: bold; color: #f59e0b; letter-spacing: 0.2em; border: 1px solid #1e293b;">
                ${resetCode}
              </div>
              <p style="color: #e2e8f0; font-size: 12px; margin-top: 24px; margin-bottom: 0;">Bu kod 15 dakika boyunca geçerlidir. Bu talebi siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.</p>
            </div>
            <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
              Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevap vermeyiniz.<br/>
              &copy; 2026 gigpath. Tüm hakları saklıdır.
            </div>
          </div>
        `
      });

      if (mailResult.success) {
        mailSent = true;
      } else {
        console.info('[AUTH PASSWORD RESET] Mail sending skipped/failed (simulated mode used):', mailResult.error);
        mailError = mailResult.error;
      }

      res.json({
        message: mailSent 
          ? 'Şifre sıfırlama kodu e-posta adresinize gönderildi.' 
          : 'Şifre sıfırlama kodu oluşturuldu. E-posta sunucusu henüz yapılandırılmadığı için simüle edildi.',
        simulated_code: mailSent ? undefined : resetCode,
        mail_sent: mailSent,
        mail_error: mailError
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Sıfırlama kodu gönderilirken hata oluştu.' });
    }
  });

  app.post('/api/auth/forgot-password-verify', (req, res) => {
    let { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'E-posta, kod ve yeni şifre gereklidir.' });
    }

    email = email.trim().toLowerCase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }

      if (!user.reset_code || user.reset_code !== code) {
        return res.status(400).json({ error: 'Girdiğiniz şifre sıfırlama kodu geçersiz veya hatalı.' });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.prepare('UPDATE users SET password = ?, reset_code = NULL, is_verified = 1 WHERE id = ?').run(hashedPassword, user.id);

      // Log in automatically after password reset
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.json({
        message: 'Şifreniz başarıyla güncellendi ve giriş yapıldı.',
        token,
        user: { id: user.id, name: user.name, email: user.email }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Şifre sıfırlanırken bir hata oluştu.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gereklidir.' });
    }

    email = email.trim().toLowerCase();

    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Geçersiz e-posta veya şifre.' });
      }

      // Automatically verify the user in db if they were not verified yet
      if (user.is_verified === 0) {
        db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?').run(user.id);
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('auth_token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.json({ message: 'Giriş başarılı', token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Sunucu hatası oluştu.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token', { path: '/' });
    res.json({ message: 'Çıkış yapıldı' });
  });

  app.post('/api/auth/delete-account', (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Güvenlik doğrulaması için şifrenizi girmelisiniz.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = decoded.id;

      // Verify password
      const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Girdiğiniz şifre hatalı.' });
      }

      // 1. Delete associated data
      db.prepare('DELETE FROM app_data WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM shared_links WHERE user_id = ?').run(userId);

      // 2. Delete the user
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      // 3. Clear cookie
      res.clearCookie('auth_token', { path: '/' });

      res.json({ success: true, message: 'Hesabınız ve tüm verileriniz başarıyla kalıcı olarak silindi.' });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(decoded.id);
      if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      res.json({ user, token });
    } catch (error) {
      res.status(401).json({ error: 'Geçersiz token' });
    }
  });

  // Sync endpoints
  app.get('/api/sync', (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const appData = db.prepare('SELECT data, updated_at FROM app_data WHERE user_id = ?').get(decoded.id) as any;
      if (!appData) {
        return res.json({ data: null, timestamp: 0, user: { name: decoded.name, email: decoded.email } });
      }
      res.json({ 
        data: JSON.parse(appData.data), 
        timestamp: new Date(appData.updated_at).getTime(),
        user: { name: decoded.name, email: decoded.email }
      });
    } catch (error) {
      res.status(500).json({ error: 'Senkronizasyon hatası' });
    }
  });

  app.post('/api/sync', (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { data } = req.body;
      
      db.prepare(`
        INSERT INTO app_data (user_id, data, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP) 
        ON CONFLICT(user_id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP
      `).run(decoded.id, JSON.stringify(data));
      
      res.json({ success: true, timestamp: Date.now() });
    } catch (error) {
      res.status(500).json({ error: 'Senkronizasyon hatası' });
    }
  });

  app.post('/api/portal/generate', (req, res) => {
    const tokenCookie = getAuthToken(req);
    if (!tokenCookie) return res.status(401).json({ error: 'Yetkilendirme gerekli' });

    try {
      const decoded = jwt.verify(tokenCookie, JWT_SECRET) as any;
      const { clientName } = req.body;
      
      if (!clientName) {
         return res.status(400).json({ error: 'Müşteri adı gereklidir.' });
      }

      const existing = db.prepare('SELECT token FROM shared_links WHERE user_id = ? AND client_name = ?').get(decoded.id, clientName) as any;
      if (existing) {
        return res.json({ token: existing.token });
      }

      const newToken = Date.now().toString(36) + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
      
      db.prepare('INSERT INTO shared_links (token, user_id, client_name) VALUES (?, ?, ?)')
        .run(newToken, decoded.id, clientName);
        
      res.json({ token: newToken });
    } catch (error) {
       console.error('Portal link error:', error);
       res.status(500).json({ error: 'Link oluşturulamadı.' });
    }
  });

  app.get('/api/portal/:token', (req, res) => {
    try {
      const { token } = req.params;
      const link = db.prepare('SELECT user_id, client_name FROM shared_links WHERE token = ?').get(token) as any;
      
      if (!link) {
        return res.status(404).json({ error: 'Geçersiz bağlantı.' });
      }

      const appDataRow = db.prepare('SELECT data FROM app_data WHERE user_id = ?').get(link.user_id) as any;
      if (!appDataRow) {
         return res.status(404).json({ error: 'Veri bulunamadı.' });
      }

      const allData = JSON.parse(appDataRow.data);
      
      const clientProjects = allData.projects?.filter((p: any) => p.clientName === link.client_name) || [];
      const projectIds = clientProjects.map((p: any) => p.id);
      const clientInvoices = allData.invoices?.filter((i: any) => projectIds.includes(i.projectId)) || [];
      
      res.json({
        clientName: link.client_name,
        profileData: {
          name: allData.profile?.name,
          title: allData.profile?.title,
          email: allData.profile?.email,
          currency: allData.profile?.currency || 'USD'
        },
        projects: clientProjects,
        invoices: clientInvoices
      });
    } catch (error) {
      console.error('Portal fetch error:', error);
      res.status(500).json({ error: 'Sunucu hatası.' });
    }
  });

  app.post('/api/assistant/chat', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API anahtarı ayarlanmamış.' });
      }

      const { messages, context } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Mesaj geçmişi bulunamadı.' });
      }

      const profile = context?.profile || {};
      const projects = context?.projects || [];
      const invoices = context?.invoices || [];
      const expenses = context?.expenses || [];

      const activeCount = projects.filter((p: any) => p.status === 'Active').length;
      const completedCount = projects.filter((p: any) => p.status === 'Completed').length;
      
      const paidSum = invoices.filter((i: any) => i.status === 'Paid').reduce((sum: number, i: any) => sum + i.amount, 0);
      const pendingSum = invoices.filter((i: any) => i.status === 'Pending').reduce((sum: number, i: any) => sum + i.amount, 0);
      
      const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const currency = profile.currency || 'USD';

      const projectListStr = projects.map((p: any) => `- ${p.title} (${p.clientName}): Durum: ${p.status}, Platform: ${p.platform}, Teslim Tarihi: ${p.deadline || 'Belirtilmemiş'}`).join('\n');

      const systemInstruction = `Sen, serbest çalışanların (freelancer'ların) iş süreçlerini, zamanlarını ve finanslarını yönetmelerine yardımcı olan akıllı ve dost canlısı bir "Yapay Zeka Yardımcı Asistanı"sın. Sana "Zaman Ölçerli Proje ve Gelir Yönetim Portalı" entegre edildi.
      
      Kullanıcının İsmi/Unvanı: ${profile.name || 'Freelancer'} ${profile.title ? `(${profile.title})` : ''}
      Tercih Ettiği Para Birimi: ${currency}
      Aylık Hedef Gelir: ${profile.monthlyIncomeTarget || 'Belirtilmemiş'}
      Aktif Projeler: ${activeCount} adet
      Tamamlanmış Projeler: ${completedCount} adet
      Mevcut Net Gelir (Ödenmiş faturalar): ${paidSum} ${currency}
      Ödeme Bekleyen Gelir (Beklemede olan): ${pendingSum} ${currency}
      Toplam Giderler: ${totalExpenses} ${currency}
      Net Kâr (Gelir - Gider): ${paidSum - totalExpenses} ${currency}
      
      Mevcut Projeler Listesi:
      ${projectListStr || 'Sistemde kayıtlı proje bulunmuyor.'}
      
      Kullanıcının iş verilerine dayanarak sorularına son derece kesin, samimi, yapıcı ve profesyonel yanıtlar ver. Gerektiğinde finansal durum analizi yap, performans veya kârlılık artırıcı tavsiyeler ver, zaman yönetimi veya müşteri ilişkileri için rehberlik et. 
      Özellikle Upwork, Fiverr, Bionluk gibi platformlarda nasıl başarılı olabileceği, teklif yazımı, verimlilik ve vergi planlamaları hakkında da tavsiyeler sunabilirsin.
      
      Yanıtlarını her zaman Türkçe olarak ver. Kolay okunabilmesi için markdown formatı (kalın kelimeler, listeler ve başlıklar) kullanarak zenginleştir.`;

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text || 'Geri bildirim alınamadı.' });
    } catch (error: any) {
      console.error('Assistant chat error:', error);
      res.status(500).json({ error: error.message || 'Asistan yanıt verirken bir hata oluştu.' });
    }
  });

  app.post('/api/categorize-expense', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API anahtarı ayarlanmamış.' });
      }

      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Gider başlığı bulunamadı.' });
      }

      const prompt = `Aşağıdaki gider açıklamasını/başlığını analiz et ve sadece şu kategorilerden birisini döndür: 'Yazılım', 'Donanım', 'Ofis', 'Pazarlama', 'Seyahat', 'Eğitim', 'Diğer'. 
      Gider Başlığı: "${title}"
      Sadece kategori adını döndür, başka hiçbir şey yazma.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1
        }
      });

      let category = response.text?.trim() || 'Diğer';
      
      // Güvenlik amaçlı, geçerli kategorilerden biri değilse default olarak "Diğer" döndür
      const validCategories = ['Yazılım', 'Donanım', 'Ofis', 'Pazarlama', 'Seyahat', 'Eğitim', 'Diğer'];
      if (!validCategories.includes(category)) {
          category = 'Diğer';
      }

      res.json({ category });
    } catch (error: any) {
      console.error('Categorize error:', error);
      res.status(500).json({ error: error.message || 'Kategorize edilirken hata oluştu.' });
    }
  });

  app.post('/api/scan-receipt', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API anahtarı ayarlanmamış.' });
      }

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Resim bulunamadı.' });
      }

      const prompt = `Analyze this receipt image and extract the following information.
      Return the result as a strict JSON object with NO markdown formatting, just the JSON.
      JSON structure:
      {
        "title": "A short descriptive title for the expense (e.g. 'Coffee Shop', 'Software Sub')",
        "amount": 100.50 (numeric value only, extract the total/grand total),
        "date": "YYYY-MM-DD" (the date on the receipt, use today context if missing),
        "category": "One of these exact strings: 'Yazılım' | 'Donanım' | 'Ofis' | 'Pazarlama' | 'Diğer'"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [
              { text: prompt }, 
              { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' }} 
            ] 
          }
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) {
        throw new Error("No response from Gemini API");
      }

      const results = JSON.parse(jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
      res.json(results);
    } catch (error: any) {
      console.error('Receipt scan error:', error);
      res.status(500).json({ error: error.message || 'Fiş taranırken bir hata oluştu.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
