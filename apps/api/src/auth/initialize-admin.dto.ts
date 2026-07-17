import { IsEmail, IsString, Length, Matches } from 'class-validator';
export class InitializeAdminDto {
  @IsString() @Length(2, 100) name!: string;
  @IsEmail() @Length(3, 254) email!: string;
  @IsString()
  @Length(12, 128)
  @Matches(/[a-z]/, { message: 'password must contain a lowercase letter' })
  @Matches(/[A-Z]/, { message: 'password must contain an uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain a number' })
  password!: string;
}
