<?php

namespace App\Http\Requests;

use App\Support\UploadPartSize;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreUploadPartRequest extends FormRequest
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
        $partSizeKb = (int) ceil(UploadPartSize::effective() / 1024);

        return [
            'chunk' => ['required', 'file', 'max:'.$partSizeKb],
        ];
    }
}
