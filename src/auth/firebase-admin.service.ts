import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private app: admin.app.App | null = null;

  constructor(private readonly configService: ConfigService) {}

  private isEnabled(): boolean {
    return Boolean(
      this.configService.get<string>('FIREBASE_PROJECT_ID') &&
        this.configService.get<string>('FIREBASE_CLIENT_EMAIL') &&
        this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
    );
  }

  private getApp(): admin.app.App {
    if (this.app) return this.app;
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Firebase auth is not configured on the server');
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') as string;
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL') as string;
    const privateKeyRaw = this.configService.get<string>('FIREBASE_PRIVATE_KEY') as string;
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    return this.app;
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      const app = this.getApp();
      return await app.auth().verifyIdToken(idToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid Firebase ID token');
    }
  }
}

