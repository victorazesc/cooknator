import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductRecognitionService } from './product-recognition.service';
import * as tf from '@tensorflow/tfjs-node';
import * as recipes from '../../../recipes.json';
import * as fs from 'fs'
@Controller('recipes')
export class ProductRecognitionController {
  constructor(
    private readonly productRecognitionService: ProductRecognitionService,
  ) {}

  @Post('recognize')
  @UseInterceptors(FileInterceptor('image'))
  async recognizeProductsInUploadedFile(
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imagePath = file.path;

    const cocoSsd = require('@tensorflow-models/coco-ssd');
    const tf = require('@tensorflow/tfjs-node');
    const fs = require('fs').promises;

    try {
      const [model, imgBuffer] = await Promise.all([
        cocoSsd.load(),
        fs.readFile(imagePath),
      ]);
      const imgTensor = tf.node.decodeImage(new Uint8Array(imgBuffer), 3);
      const predictions = await model.detect(imgTensor);

      const products = predictions.map((numero) => {
        return numero.class;
      });
      const uniqueClasses = [...new Set(products)];

      const recipes =
        await this.productRecognitionService.searchRecipesByIngredients(
          uniqueClasses as string[],
        );
      return { recipes: recipes[0] };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to recognize products in uploaded file');
    }
  }

  @Get('search')
  async search(@Query('ingredients') ingredients, @Req() req) {
    console.log(ingredients);
    console.log(req);
    const recipes =
      await this.productRecognitionService.searchRecipesByIngredients(
        ingredients?.split(',') ?? [],
      );
    return { recipes: recipes[0] };
  }

  @Get('/:id')
  async getRecipe(@Param('id') id: string) {
    const recipe = await this.productRecognitionService.getRecipe(id);
    return recipe
  }

  @Get('all')
  async as(@Query('ingredients') ingredients, @Req() req) {
    const axios = require('axios');

    const receitas = [];

    for (let index = 0; index < 10; index++) {
      const element = recipes[index];
      if(!element.imagem) {
        const imagem = await axios.get('https://api.pexels.com/v1/search', {
          params: {
            query: element.nome,
            per_page: 1,
          },
          headers: {
            Authorization:
              'IF27JZaUXWPDxbAyGwtnbS3mxRF7LWTWnOmju6jYjRRjt9XejsPr0Qvq',
          },
        });
        receitas.push({...element, imagem: imagem?.data?.photos[0]?.url })
      } else {
        receitas.push(element)
      }
      fs.writeFileSync('recipesv2.json', JSON.stringify(receitas, null, 2));
    }
    return receitas
  }
}
