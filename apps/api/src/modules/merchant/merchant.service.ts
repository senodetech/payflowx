import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant, MerchantStatus } from './entities/merchant.entity';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
  ) {}

  async getProfile(merchantId: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({ where: { id: merchantId } });
    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
    return merchant;
  }

  async updateProfile(merchantId: string, payload: any): Promise<Merchant> {
    const merchant = await this.getProfile(merchantId);
    if (payload.name) {
      merchant.name = payload.name;
    }
    return this.merchantRepository.save(merchant);
  }

  async approveMerchant(merchantId: string): Promise<Merchant> {
    const merchant = await this.getProfile(merchantId);
    merchant.status = MerchantStatus.ACTIVE;
    return this.merchantRepository.save(merchant);
  }

  async listMerchants(): Promise<Merchant[]> {
    return this.merchantRepository.find();
  }
}
