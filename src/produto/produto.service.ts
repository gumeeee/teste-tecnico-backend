import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CompraProdutoDto } from './dto/compra-produto.dto';
import { VendaProdutoDto } from './dto/venda-produto.dto';
import { Operacao, Produto } from '@prisma/client';

@Injectable()
export class ProdutoService {
  constructor(private prisma: PrismaService) {}

  async buscarTodos(): Promise<Produto[]> {
    //método que retorna todos os produtos com status ativo (true)
    const produtos = await this.prisma.produto.findMany({
      where: { status: true },
    });
    if (!produtos)
      throw new InternalServerErrorException(
        'Não foi possível buscar os produtos.',
      );
    return produtos;
  }

  async criar(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    //desenvolver método que cria um novo produto, retornando o produto criado

    const { nome } = createProdutoDto;

    const produtoExistente = await this.prisma.produto.findUnique({
      where: { nome },
    });
    if (produtoExistente) {
      throw new ConflictException(`Já existe um produto com o nome informado.`);
    }

    try {
      return await this.prisma.produto.create({
        data: createProdutoDto,
      });
    } catch (err) {
      throw new InternalServerErrorException('Erro ao criar o produto.');
    }
  }

  async buscarPorId(id: number): Promise<Produto> {
    //desenvolver método para retornar o produto do id informado, com os respectivos dados de operações
    try {
      const produto = await this.prisma.produto.findUnique({
        where: { id },
        include: { operacoes: true },
      });
      if (!produto) throw new NotFoundException('Produto não encontrado.');
      return produto;
    } catch (err) {
      throw new InternalServerErrorException('Erro ao buscar o produto.');
    }
  }

  async atualizar(
    id: number,
    updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    //desenvolver método para atualizar os dados do produto do id informado, retornando o produto atualizado
    const { nome, precoCompra, precoVenda, quantidade } = updateProdutoDto;

    const produtoExistente = await this.prisma.produto.findUnique({
      where: { id },
    });

    if (!produtoExistente) {
      throw new NotFoundException(`Produto com o id informado é inexistente.`);
    }

    if (nome && nome !== produtoExistente.nome) {
      const produtoComMesmoNome = await this.prisma.produto.findUnique({
        where: { nome },
      });

      if (produtoComMesmoNome) {
        throw new ConflictException(`Já existe um produto com esse nome.`);
      }
    }

    if (precoCompra < 0) {
      throw new BadRequestException('O preço de compra não pode ser negativo.');
    }
    if (precoVenda < 0) {
      throw new BadRequestException('O preço de venda não pode ser negativo.');
    }
    if (quantidade < 0) {
      throw new BadRequestException('A quantidade não pode ser negativa.');
    }

    try {
      return await this.prisma.produto.update({
        where: { id },
        data: updateProdutoDto,
      });
    } catch (err) {
      throw new InternalServerErrorException('Erro ao atualizar o produto.');
    }
  }

  async desativar(id: number): Promise<Produto> {
    //desenvolver método para desativar o produto, mudar o status para false
    const produto = await this.prisma.produto.findUnique({ where: { id } });

    if (!produto) {
      throw new NotFoundException('Produto com o id informado não encontrado.');
    }

    if (!produto.status) {
      throw new BadRequestException(
        'Produto com o id informado já está desativado.',
      );
    }

    try {
      return await this.prisma.produto.update({
        where: { id },
        data: { status: false },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erro ao desativar o produto.');
    }
  }

  async comprarProdutos(
    id: number,
    compraProdutoDto: CompraProdutoDto,
  ): Promise<Operacao> {
    //desenvolver método que executa a operação de compra, retornando a operação com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //o preço de venda do produto deve ser calculado a partir do preço inserido na operacao, com uma margem de 50% de lucro
    //caso o novo preço seja maior que o preço de venda atual, o preço de venda deve ser atualizado, assim como o preço de compra
    //calcular o valor total gasto na compra (quantidade * preco)
    //deve também atualizar a quantidade do produto, somando a quantidade comprada

    const { quantidade, preco } = compraProdutoDto;
    const tipo = 1;

    if (preco <= 0) {
      throw new BadRequestException('O preço é preciso ser maior que zero.');
    }

    if (quantidade <= 0) {
      throw new BadRequestException(
        'A quantidade é preciso ser maior que zero.',
      );
    }

    const produto = await this.prisma.produto.findUnique({ where: { id } });

    if (!produto) {
      throw new NotFoundException(`Produto com id informado não encontrado.`);
    }

    if (!produto.status) {
      throw new BadRequestException(
        'Não é possível comprar um produto desativado.',
      );
    }

    try {
      const produto = await this.prisma.produto.findUnique({ where: { id } });
      if (!produto)
        throw new NotFoundException('Produto com o id não encontrado.');

      const precoVenda = Math.max(produto.precoVenda || 0, preco * 1.5);
      const novoProduto = await this.prisma.produto.update({
        where: { id },
        data: {
          quantidade: (produto.quantidade || 0) + quantidade,
          precoCompra: preco,
          precoVenda,
        },
      });

      return await this.prisma.operacao.create({
        data: {
          tipo,
          quantidade,
          preco,
          total: quantidade * preco,
          produtoId: novoProduto.id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao realizar a operação de compra.',
      );
    }
  }

  async venderProdutos(
    id: number,
    vendaProduto: VendaProdutoDto,
  ): Promise<Operacao> {
    //desenvolver método que executa a operação de venda, retornando a venda com os respectivos dados do produto
    //tipo: 1 - compra, 2 - venda
    //calcular o valor total recebido na venda (quantidade * preco)
    //deve também atualizar a quantidade do produto, subtraindo a quantidade vendida
    //caso a quantidade seja esgotada, ou seja, chegue a 0, você deverá atualizar os precoVenda e precoCompra para 0
    const { quantidade } = vendaProduto;
    const tipo = 2;

    if (quantidade <= 0) {
      throw new BadRequestException('Quantidade e deve ser maior que zero.');
    }

    try {
      const produto = await this.prisma.produto.findUnique({ where: { id } });
      if (!produto) throw new NotFoundException('Produto não encontrado.');

      if ((produto.quantidade || 0) < quantidade) {
        throw new BadRequestException('Quantidade insuficiente em estoque.');
      }

      const novaQuantidade = (produto.quantidade || 0) - quantidade;

      const novoProduto = await this.prisma.produto.update({
        where: { id },
        data: {
          quantidade: novaQuantidade,
          precoCompra: novaQuantidade === 0 ? 0 : produto.precoCompra,
          precoVenda: novaQuantidade === 0 ? 0 : produto.precoVenda,
        },
      });

      const preco = novoProduto.precoVenda;

      return await this.prisma.operacao.create({
        data: {
          tipo,
          quantidade,
          preco,
          total: quantidade * preco,
          produtoId: novoProduto.id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao realizar a operação de venda.',
      );
    }
  }
}
