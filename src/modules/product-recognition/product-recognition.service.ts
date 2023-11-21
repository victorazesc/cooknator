import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import axios from 'axios';
import * as recipes from '../../../recipesV3.json';
import { v2 } from '@google-cloud/translate';
import * as Ingredients from '../../../ingredients.json';
import * as fs from 'fs'

@Injectable()
export class ProductRecognitionService {
  private readonly client: ImageAnnotatorClient;
  private translate: v2.Translate;
  configService: any;

  constructor() {
    // Crie um cliente para a API do Google Vision usando as credenciais definidas no .env
    this.client = new ImageAnnotatorClient();
    this.translate = new v2.Translate();
  }

  async recognizeProductsInImage(imagePath: string): Promise<string[]> {
    try {
      // Leia a imagem como um buffer
      const imageBuffer = await require('fs').readFileSync(imagePath);
      console.log(imageBuffer);
      const request = {
        image: {
          source: {
            imageUri: `data:image/jpeg;base64,${imageBuffer}`,
          },
        },
        features: [],
      };
      // Execute a chamada da API do Google Vision para detecção de produtos
      const [result] = await this.client.objectLocalization(imageBuffer);
      console.log(result.localizedObjectAnnotations);
      // Retorne as informações dos produtos detectados
      const products = result.localizedObjectAnnotations;
      return products.map((product) => product.name);
    } catch (err) {
      console.error('Erro ao reconhecer produtos:', err);
      return [];
    }
  }
  private readonly API_KEY = '764298d7f0ac460cb8e9a5e030f142b7';
  buscarObjetoPorString(arrayDeObjetos, stringProcurada) {
    for (let i = 0; i < arrayDeObjetos.length; i++) {
      const secao = arrayDeObjetos[i];
      if (secao.nome === ' Ingredientes') {
        for (let j = 0; j < secao.conteudo.length; j++) {
          const conteudo = secao.conteudo[j];
          if (conteudo.includes(stringProcurada)) {
            return secao;
          }
        }
      }
    }
    return null;
  }
  async searchRecipesByIngredients(ingredients: string[]): Promise<any> {
 
    function buscarReceitasPorIngrediente(receitas, ingrediente) {
      console.log(ingrediente)
      const resultados = new Set()
      for (let i = 0; i < receitas.length; i++) {
        let receita = receitas[i];
        const recipeString = JSON.stringify(receita)
        const acho = recipeString.includes(ingrediente)
        if(acho) {
          resultados.add({title: receita.title, id: receita.id, image: receita.image, likes: 0 })
        }
      }
      return resultados;
    }

    let response = new Set()
      for (let i = 0; i < ingredients.length; i++) {
        let ingredient = ""
        if(!Ingredients[ingredients[i]]) {
          const [translation] = await this.translate.translate(ingredients[i], 'pt-BR');
          ingredient = translation
          Ingredients[ingredients[i]] = translation
          fs.writeFileSync('ingredients.json', JSON.stringify(Ingredients, null, 2));
        } else {
          console.log(Ingredients[ingredients[i]])
          ingredient = Ingredients[ingredients[i]]
        }

        // console.log(recipes)
     response.add([...buscarReceitasPorIngrediente(recipes, ingredient)]);
    }

    let ponse = [...response]
        ponse = ponse.filter(function (a) {
      return !this[JSON.stringify(a)] && (this[JSON.stringify(a)] = true);
    }, Object.create(null))
    
    // console.log(ponse)
    return ponse
  }

  async getRecipe(id: string) {
    const recip = recipes as any
    return recip.find(item => {return item.id === id})
  }
}
