import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity } from 'typeorm';

@Entity('imc_calculadora')
export class ImcEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 5, scale: 2 })
  peso: number;

  @Column('decimal', { precision: 3, scale: 2 })
  altura: number;

  @Column('decimal', { precision: 5, scale: 2 })
  imc: number;

  @Column()
  categoria: string;

  @Column()
  fecha: Date;

  @Column({ nullable: true })
  userId?: string;
}
