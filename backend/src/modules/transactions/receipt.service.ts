import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import PDFDocument from 'pdfkit';
import { Transaction } from './entities/transaction.entity';
import { Readable } from 'stream';

@Injectable()
export class ReceiptService {
  private s3: S3;
  private bucket: string;
  private region: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('DO_SPACE_REGION') || '';
    this.bucket = this.configService.get<string>('DO_SPACE_BUCKET') || '';
    this.endpoint = this.configService.get<string>('DO_SPACE_ENDPOINT') || '';
    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.region,
      accessKeyId: this.configService.get<string>('DO_SPACE_KEY') || '',
      secretAccessKey: this.configService.get<string>('DO_SPACE_SECRET') || '',
      signatureVersion: 'v4',
    });
  }

  async generateAndUploadReceipt(transaction: Transaction): Promise<string> {
    // Generate PDF
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', (data) => buffers.push(data));
    doc.on('end', async () => {});

    doc.fontSize(20).text('Sales Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Date: ${transaction.createdAt.toLocaleString()}`);
    doc.text(`Customer: ${transaction.customerName || 'Walk-in'}`);
    doc.text(`Phone: ${transaction.phone || '-'}`);
    doc.text(`Item: ${transaction.item ? transaction.item.name : 'N/A'}`);
    doc.text(`Quantity: ${transaction.quantity}`);
    doc.text(`Unit Price: ₦${Number(transaction.unitPrice).toLocaleString()}`);
    doc.text(`Total: ₦${Number(transaction.totalAmount).toLocaleString()}`);
    doc.moveDown();
    doc.text('Thank you for your purchase!', { align: 'center' });
    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(buffers);

    // Upload to DigitalOcean Space
    const key = `receipts/${transaction.id}.pdf`;
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ACL: 'public-read',
        ContentType: 'application/pdf',
      })
      .promise();

    const url = `https://${this.bucket}.${this.endpoint.replace('https://', '')}/${key}`;
    return url;
  }
}
