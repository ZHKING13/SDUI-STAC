import { BadRequestException, PipeTransform } from '@nestjs/common';
import { toFieldErrors } from '@famille/shared';
import type { ZodTypeAny, output } from 'zod';

/** Valide un corps de requête avec un schéma partagé avec le site web. */
export class ZodValidationPipe<S extends ZodTypeAny> implements PipeTransform<unknown, output<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): output<S> {
    const result = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Certains champs sont invalides.',
        errors: toFieldErrors(result.error),
      });
    }
    return result.data;
  }
}
