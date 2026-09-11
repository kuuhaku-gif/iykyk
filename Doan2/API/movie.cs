using BLL.Interfaces;
using Doan2.model;
using Microsoft.AspNetCore.Mvc;
using Model;
using System;
using System.Collections.Generic;

namespace API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MovieController : ControllerBase
    {
        private readonly IMovieBusiness _movieBusiness;

        public MovieController(IMovieBusiness movieBusiness)
        {
            _movieBusiness = movieBusiness;
        }

        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            try
            {
                var res = _movieBusiness.GetAllMovies();
                return Ok(new { success = true, data = res });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("get-by-id/{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var res = _movieBusiness.GetMovieById(id);
                if (res == null)
                    return NotFound(new { success = false, message = "Không tìm thấy phim!" });

                return Ok(new { success = true, data = res });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("create-movie")]
        public IActionResult CreateMovie([FromBody] MovieModel model)
        {
            try
            {
                var res = _movieBusiness.CreateMovie(model);
                return Ok(new { success = res, message = "Thêm mới phim thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("delete-movie/{id}")]
        public IActionResult DeleteMovie(int id)
        {
            try
            {
                var res = _movieBusiness.DeleteMovie(id);
                return Ok(new { success = res, message = "Xoá phim thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
