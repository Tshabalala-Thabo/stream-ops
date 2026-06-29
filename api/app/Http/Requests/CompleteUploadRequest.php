<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'uploadedParts' => ['sometimes', 'array'],
            'uploadedParts.*.partNumber' => ['required_with:uploadedParts', 'integer', 'min:1'],
            'uploadedParts.*.etag' => ['required_with:uploadedParts', 'string', 'max:255'],
            'uploadedParts.*.size' => ['required_with:uploadedParts', 'integer', 'min:1'],
        ];
    }
}
