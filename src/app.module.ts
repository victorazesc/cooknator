import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductRecognitionController } from './modules/product-recognition/product-recognition.controller';
import { ProductRecognitionService } from './modules/product-recognition/product-recognition.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [ProductRecognitionController],
  providers: [ProductRecognitionService],
})
export class AppModule {}
