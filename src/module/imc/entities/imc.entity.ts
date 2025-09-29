import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('imcCalculadora')
export class ImcEntity {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  peso: number;

  @Column()
  altura: number;

  @Column()
  imc: number;

  @Column()
  categoria: string;

  @Column()
  fecha: Date;

  @Column({ nullable: true })
  userId?: string;
}
