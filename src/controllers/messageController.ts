// /root/api/big2/beta/api-big-conect/src/controllers/messageController.ts
import { Request, Response } from 'express';
import { IApiResponse } from '../types';
import { MessageTextController } from './messageTextController';
import { MessageAudioController } from './messageAudioController';
import { MessageVideoController } from './messageVideoController';
import { MessageImageController } from './messageImageController';
import { MessageDocumentController } from './messageDocumentController';
import { MessageInteractiveController } from './messageInteractiveController';

export class MessageController {
  private textController: MessageTextController;
  private audioController: MessageAudioController;
  private videoController: MessageVideoController;
  private imageController: MessageImageController;
  private documentController: MessageDocumentController;
  private interactiveController: MessageInteractiveController;

  constructor() {
    this.textController = new MessageTextController();
    this.audioController = new MessageAudioController();
    this.videoController = new MessageVideoController();
    this.imageController = new MessageImageController();
    this.documentController = new MessageDocumentController();
    this.interactiveController = new MessageInteractiveController();
  }

  // ========== TEXT MESSAGES ==========
  async sendText(req: Request, res: Response) {
    await this.textController.sendText(req, res);
  }

  // ========== MEDIA MESSAGES ==========
  async sendMedia(req: Request, res: Response) {
    try {
      const { type } = req.body;
      
      switch (type) {
        case 'audio':
          await this.audioController.sendAudio(req, res);
          break;
        case 'video':
          await this.videoController.sendVideo(req, res);
          break;
        case 'image':
          await this.imageController.sendImage(req, res);
          break;
        case 'document':
          await this.documentController.sendDocument(req, res);
          break;
        case 'sticker':
          await this.imageController.sendSticker(req, res);
          break;
        default:
          const response: IApiResponse = {
            success: false,
            error: 'Unsupported media type. Supported types: image, video, audio, document, sticker'
          };
          return res.status(400).json(response);
      }
    } catch (error: any) {
      const response: IApiResponse = {
        success: false,
        error: error.message || 'Failed to send media message'
      };
      res.status(500).json(response);
    }
  }

  // ========== INTERACTIVE MESSAGES ==========
  async sendButtons(req: Request, res: Response) {
    await this.interactiveController.sendButtons(req, res);
  }

  async sendListMessage(req: Request, res: Response) {
    await this.interactiveController.sendListMessage(req, res);
  }

  async sendTemplate(req: Request, res: Response) {
    await this.interactiveController.sendTemplate(req, res);
  }

  // ========== BULK MESSAGES ==========
  async sendBulkMessages(req: Request, res: Response) {
    await this.interactiveController.sendBulkMessages(req, res);
  }

  // ========== REACTIONS ==========
  async sendReaction(req: Request, res: Response) {
    await this.interactiveController.sendReaction(req, res);
  }
}

export default new MessageController();