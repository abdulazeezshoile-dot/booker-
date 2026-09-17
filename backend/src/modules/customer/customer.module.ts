import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './customer.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { CustomerService } from './customer.service';
import {
  CustomerController,
  WorkspaceCustomerController,
} from './customer.controller';
import { Branch } from '../workspace/entities/branch.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Workspace, Branch]),
    WorkspaceModule,
    BillingModule,
  ],
  providers: [CustomerService],
  controllers: [CustomerController, WorkspaceCustomerController],
  exports: [CustomerService],
})
export class CustomerModule {}
